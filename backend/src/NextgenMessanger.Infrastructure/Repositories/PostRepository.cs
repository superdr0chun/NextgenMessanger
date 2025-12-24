using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;
using NextgenMessanger.Core.Repositories;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Infrastructure.Repositories;

public class PostRepository : Repository<Post>, IPostRepository
{
    public PostRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Post?> GetByIdWithAuthorAsync(Guid postId)
    {
        return await _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => p.Id == postId && !p.Deleted)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Post>> GetPublicPostsAsync(int page, int pageSize, string? searchQuery = null)
    {
        var query = _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => !p.Deleted && p.Visibility == PostVisibility.Public);

        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            query = query.Where(p => p.Content != null && p.Content.Contains(searchQuery));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Post>> GetUserPostsAsync(Guid userId, Guid? currentUserId, int page, int pageSize)
    {
        var query = _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => p.AuthorId == userId && !p.Deleted);

        if (currentUserId != userId)
        {
            query = query.Where(p => p.Visibility == PostVisibility.Public ||
                (p.Visibility == PostVisibility.Followers && currentUserId != null &&
                 _context.Follows.Any(f => f.FollowerId == currentUserId
                     && f.FolloweeId == userId
                     && f.Status == FollowStatus.Accepted
                     && !f.Deleted)));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Post>> GetFeedPostsAsync(Guid userId, IEnumerable<Guid> followingIds, int page, int pageSize)
    {
        return await _context.Posts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Where(p => followingIds.Contains(p.AuthorId)
                && !p.Deleted
                && (p.Visibility == PostVisibility.Public || p.Visibility == PostVisibility.Followers))
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetReactionsCountAsync(Guid postId)
    {
        return await _context.Reactions
            .CountAsync(r => r.PostId == postId && !r.Deleted);
    }

    public async Task<int> GetCommentsCountAsync(Guid postId)
    {
        return await _context.Comments
            .CountAsync(c => c.PostId == postId && !c.Deleted);
    }

    public async Task<bool> IsLikedByUserAsync(Guid postId, Guid userId)
    {
        return await _context.Reactions
            .AnyAsync(r => r.PostId == postId
                && r.UserId == userId
                && r.Type == ReactionType.Like
                && !r.Deleted);
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followeeId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId
                && f.FolloweeId == followeeId
                && f.Status == FollowStatus.Accepted
                && !f.Deleted);
    }

    public async Task<bool> CanUserViewPostAsync(Post post, Guid? currentUserId)
    {
        if (post.Visibility == PostVisibility.Public)
            return true;

        if (post.Visibility == PostVisibility.Private)
            return currentUserId == post.AuthorId;

        if (post.Visibility == PostVisibility.Followers)
        {
            if (currentUserId == null || currentUserId == post.AuthorId)
                return true;

            return await IsFollowingAsync(currentUserId.Value, post.AuthorId);
        }

        return false;
    }

    public async Task<Dictionary<Guid, int>> GetReactionsCountsAsync(IEnumerable<Guid> postIds)
    {
        return await _context.Reactions
            .Where(r => postIds.Contains(r.PostId) && !r.Deleted)
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);
    }

    public async Task<Dictionary<Guid, int>> GetCommentsCountsAsync(IEnumerable<Guid> postIds)
    {
        return await _context.Comments
            .Where(c => postIds.Contains(c.PostId) && !c.Deleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);
    }

    public async Task<HashSet<Guid>> GetLikedPostIdsAsync(IEnumerable<Guid> postIds, Guid userId)
    {
        var likedIds = await _context.Reactions
            .Where(r => postIds.Contains(r.PostId)
                && r.UserId == userId
                && r.Type == ReactionType.Like
                && !r.Deleted)
            .Select(r => r.PostId)
            .ToListAsync();

        return new HashSet<Guid>(likedIds);
    }
}

