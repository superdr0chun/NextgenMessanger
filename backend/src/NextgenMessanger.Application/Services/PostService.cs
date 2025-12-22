using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Post;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class PostService : IPostService
{
    private readonly ApplicationDbContext _context;

    public PostService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostDto> CreatePostAsync(Guid authorId, CreatePostDto createDto)
    {
        var post = new Core.Entities.Post
        {
            Id = Guid.NewGuid(),
            AuthorId = authorId,
            Content = createDto.Content,
            MediaUrl = createDto.MediaUrl ?? new List<string>(),
            Visibility = createDto.Visibility,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(post.Id, authorId) ?? throw new InvalidOperationException("Failed to create post");
    }

    public async Task<PostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        var post = await _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => p.Id == postId && !p.Deleted)
            .FirstOrDefaultAsync();

        if (post == null)
        {
            return null;
        }

        if (post.Visibility == "private" && currentUserId != post.AuthorId)
        {
            return null;
        }

        if (post.Visibility == "followers" && currentUserId != null && currentUserId != post.AuthorId)
        {
            var isFollowing = await _context.Follows
                .AnyAsync(f => f.FollowerId == currentUserId 
                    && f.FolloweeId == post.AuthorId 
                    && f.Status == "accepted" 
                    && !f.Deleted);
            
            if (!isFollowing)
            {
                return null;
            }
        }

        var reactionsCount = await _context.Reactions
            .CountAsync(r => r.PostId == postId && !r.Deleted);

        var commentsCount = await _context.Comments
            .CountAsync(c => c.PostId == postId && !c.Deleted);

        var isLiked = currentUserId.HasValue && await _context.Reactions
            .AnyAsync(r => r.PostId == postId 
                && r.UserId == currentUserId 
                && r.Type == "like" 
                && !r.Deleted);

        return new PostDto
        {
            Id = post.Id,
            AuthorId = post.AuthorId,
            AuthorUsername = post.Author.Username,
            AuthorAvatarUrl = post.Author.Profile?.AvatarUrl,
            Content = post.Content,
            MediaUrl = post.MediaUrl,
            Visibility = post.Visibility,
            ReactionsCount = reactionsCount,
            CommentsCount = commentsCount,
            IsLikedByCurrentUser = isLiked,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }

    public async Task<IEnumerable<PostDto>> GetPostsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null, string? searchQuery = null)
    {
        var postsQuery = _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => !p.Deleted && p.Visibility == "public");

        // Поиск по тексту поста, если указан запрос
        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            postsQuery = postsQuery.Where(p => p.Content != null && p.Content.Contains(searchQuery));
        }

        postsQuery = postsQuery.OrderByDescending(p => p.CreatedAt);

        var posts = await postsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var postIds = posts.Select(p => p.Id).ToList();

        var reactionsCounts = await _context.Reactions
            .Where(r => postIds.Contains(r.PostId) && !r.Deleted)
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var commentsCounts = await _context.Comments
            .Where(c => postIds.Contains(c.PostId) && !c.Deleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var likedPostIds = currentUserId.HasValue
            ? await _context.Reactions
                .Where(r => postIds.Contains(r.PostId) 
                    && r.UserId == currentUserId 
                    && r.Type == "like" 
                    && !r.Deleted)
                .Select(r => r.PostId)
                .ToListAsync()
            : new List<Guid>();

        return posts.Select(post =>
        {
            var reactionsCount = reactionsCounts.FirstOrDefault(rc => rc.PostId == post.Id)?.Count ?? 0;
            var commentsCount = commentsCounts.FirstOrDefault(cc => cc.PostId == post.Id)?.Count ?? 0;
            var isLiked = likedPostIds.Contains(post.Id);

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorUsername = post.Author.Username,
                AuthorAvatarUrl = post.Author.Profile?.AvatarUrl,
                Content = post.Content,
                MediaUrl = post.MediaUrl,
                Visibility = post.Visibility,
                ReactionsCount = reactionsCount,
                CommentsCount = commentsCount,
                IsLikedByCurrentUser = isLiked,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt
            };
        });
    }

    public async Task<IEnumerable<PostDto>> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var postsQuery = _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => p.AuthorId == userId && !p.Deleted);

        if (currentUserId != userId)
        {
            postsQuery = postsQuery.Where(p => p.Visibility == "public" || 
                (p.Visibility == "followers" && currentUserId != null && 
                 _context.Follows.Any(f => f.FollowerId == currentUserId 
                     && f.FolloweeId == userId 
                     && f.Status == "accepted" 
                     && !f.Deleted)));
        }

        var posts = await postsQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var postIds = posts.Select(p => p.Id).ToList();

        var reactionsCounts = await _context.Reactions
            .Where(r => postIds.Contains(r.PostId) && !r.Deleted)
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var commentsCounts = await _context.Comments
            .Where(c => postIds.Contains(c.PostId) && !c.Deleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var likedPostIds = currentUserId.HasValue
            ? await _context.Reactions
                .Where(r => postIds.Contains(r.PostId) 
                    && r.UserId == currentUserId 
                    && r.Type == "like" 
                    && !r.Deleted)
                .Select(r => r.PostId)
                .ToListAsync()
            : new List<Guid>();

        return posts.Select(post =>
        {
            var reactionsCount = reactionsCounts.FirstOrDefault(rc => rc.PostId == post.Id)?.Count ?? 0;
            var commentsCount = commentsCounts.FirstOrDefault(cc => cc.PostId == post.Id)?.Count ?? 0;
            var isLiked = likedPostIds.Contains(post.Id);

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorUsername = post.Author.Username,
                AuthorAvatarUrl = post.Author.Profile?.AvatarUrl,
                Content = post.Content,
                MediaUrl = post.MediaUrl,
                Visibility = post.Visibility,
                ReactionsCount = reactionsCount,
                CommentsCount = commentsCount,
                IsLikedByCurrentUser = isLiked,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt
            };
        });
    }

    public async Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var followingIds = await _context.Follows
            .Where(f => f.FollowerId == userId 
                && f.Status == "accepted" 
                && !f.Deleted)
            .Select(f => f.FolloweeId)
            .ToListAsync();

        var postsQuery = _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => followingIds.Contains(p.AuthorId) 
                && !p.Deleted 
                && (p.Visibility == "public" || p.Visibility == "followers"))
            .OrderByDescending(p => p.CreatedAt);

        var posts = await postsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var postIds = posts.Select(p => p.Id).ToList();

        var reactionsCounts = await _context.Reactions
            .Where(r => postIds.Contains(r.PostId) && !r.Deleted)
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var commentsCounts = await _context.Comments
            .Where(c => postIds.Contains(c.PostId) && !c.Deleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToListAsync();

        var likedPostIds = await _context.Reactions
            .Where(r => postIds.Contains(r.PostId) 
                && r.UserId == userId 
                && r.Type == "like" 
                && !r.Deleted)
            .Select(r => r.PostId)
            .ToListAsync();

        return posts.Select(post =>
        {
            var reactionsCount = reactionsCounts.FirstOrDefault(rc => rc.PostId == post.Id)?.Count ?? 0;
            var commentsCount = commentsCounts.FirstOrDefault(cc => cc.PostId == post.Id)?.Count ?? 0;
            var isLiked = likedPostIds.Contains(post.Id);

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorUsername = post.Author.Username,
                AuthorAvatarUrl = post.Author.Profile?.AvatarUrl,
                Content = post.Content,
                MediaUrl = post.MediaUrl,
                Visibility = post.Visibility,
                ReactionsCount = reactionsCount,
                CommentsCount = commentsCount,
                IsLikedByCurrentUser = isLiked,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt
            };
        });
    }

    public async Task<PostDto> UpdatePostAsync(Guid postId, Guid userId, UpdatePostDto updateDto)
    {
        var post = await _context.Posts
            .FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);

        if (post == null)
        {
            throw new KeyNotFoundException("Post not found");
        }

        if (post.AuthorId != userId)
        {
            throw new UnauthorizedAccessException("You can only update your own posts");
        }

        if (updateDto.Content != null)
        {
            post.Content = updateDto.Content;
        }

        if (updateDto.MediaUrl != null)
        {
            post.MediaUrl = updateDto.MediaUrl;
        }

        if (updateDto.Visibility != null)
        {
            post.Visibility = updateDto.Visibility;
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(postId, userId) ?? throw new InvalidOperationException("Failed to update post");
    }

    public async Task DeletePostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts
            .FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);

        if (post == null)
        {
            throw new KeyNotFoundException("Post not found");
        }

        if (post.AuthorId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own posts");
        }

        post.Deleted = true;
        post.DeletedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}

