using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.Repositories;
using NextgenMessanger.Core.DTOs.Post;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly ApplicationDbContext _context;

    public PostService(IPostRepository postRepository, ApplicationDbContext context)
    {
        _postRepository = postRepository;
        _context = context;
    }

    public async Task<PostDto> CreatePostAsync(Guid authorId, CreatePostDto createDto)
    {
        var post = new Post
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

        await _postRepository.AddAsync(post);
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(post.Id, authorId) ?? throw new InvalidOperationException("Failed to create post");
    }

    public async Task<PostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        var post = await _postRepository.GetByIdWithAuthorAsync(postId);

        if (post == null)
        {
            return null;
        }

        if (!await _postRepository.CanUserViewPostAsync(post, currentUserId))
        {
            return null;
        }

        var reactionsCount = await _postRepository.GetReactionsCountAsync(postId);
        var commentsCount = await _postRepository.GetCommentsCountAsync(postId);
        var isLiked = currentUserId.HasValue && await _postRepository.IsLikedByUserAsync(postId, currentUserId.Value);

        return PostDto.MapFromEntity(post, reactionsCount, commentsCount, isLiked);
    }

    public async Task<IEnumerable<PostDto>> GetPostsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null, string? searchQuery = null)
    {
        var posts = await _postRepository.GetPublicPostsAsync(page, pageSize, searchQuery);
        var postIds = posts.Select(p => p.Id).ToList();

        // Run queries sequentially to avoid DbContext concurrency issues
        var reactionsCounts = await _postRepository.GetReactionsCountsAsync(postIds);
        var commentsCounts = await _postRepository.GetCommentsCountsAsync(postIds);
        var likedPostIds = currentUserId.HasValue
            ? await _postRepository.GetLikedPostIdsAsync(postIds, currentUserId.Value)
            : new HashSet<Guid>();

        return posts.Select(post =>
        {
            reactionsCounts.TryGetValue(post.Id, out var reactionsCount);
            commentsCounts.TryGetValue(post.Id, out var commentsCount);
            var isLiked = likedPostIds.Contains(post.Id);

            return PostDto.MapFromEntity(post, reactionsCount, commentsCount, isLiked);
        });
    }

    public async Task<IEnumerable<PostDto>> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var posts = await _postRepository.GetUserPostsAsync(userId, currentUserId, page, pageSize);
        var postIds = posts.Select(p => p.Id).ToList();

        // Run queries sequentially to avoid DbContext concurrency issues
        var reactionsCounts = await _postRepository.GetReactionsCountsAsync(postIds);
        var commentsCounts = await _postRepository.GetCommentsCountsAsync(postIds);
        var likedPostIds = currentUserId.HasValue
            ? await _postRepository.GetLikedPostIdsAsync(postIds, currentUserId.Value)
            : new HashSet<Guid>();

        return posts.Select(post =>
        {
            reactionsCounts.TryGetValue(post.Id, out var reactionsCount);
            commentsCounts.TryGetValue(post.Id, out var commentsCount);
            var isLiked = likedPostIds.Contains(post.Id);

            return PostDto.MapFromEntity(post, reactionsCount, commentsCount, isLiked);
        });
    }

    public async Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var followingIds = await _context.Follows
            .Where(f => f.FollowerId == userId
                && f.Status == FollowStatus.Accepted
                && !f.Deleted)
            .Select(f => f.FolloweeId)
            .ToListAsync();

        var posts = await _postRepository.GetFeedPostsAsync(userId, followingIds, page, pageSize);
        var postIds = posts.Select(p => p.Id).ToList();

        // Run queries sequentially to avoid DbContext concurrency issues
        var reactionsCounts = await _postRepository.GetReactionsCountsAsync(postIds);
        var commentsCounts = await _postRepository.GetCommentsCountsAsync(postIds);
        var likedPostIds = await _postRepository.GetLikedPostIdsAsync(postIds, userId);

        return posts.Select(post =>
        {
            reactionsCounts.TryGetValue(post.Id, out var reactionsCount);
            commentsCounts.TryGetValue(post.Id, out var commentsCount);
            var isLiked = likedPostIds.Contains(post.Id);

            return PostDto.MapFromEntity(post, reactionsCount, commentsCount, isLiked);
        });
    }

    public async Task<PostDto> UpdatePostAsync(Guid postId, Guid userId, UpdatePostDto updateDto)
    {
        var post = await _postRepository.GetByIdAsync(postId);

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

        if (updateDto.Visibility.HasValue)
        {
            post.Visibility = updateDto.Visibility.Value;
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _postRepository.UpdateAsync(post);
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(postId, userId) ?? throw new InvalidOperationException("Failed to update post");
    }

    public async Task DeletePostAsync(Guid postId, Guid userId)
    {
        var post = await _postRepository.GetByIdAsync(postId);

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
        await _postRepository.UpdateAsync(post);
        await _context.SaveChangesAsync();
    }
}
