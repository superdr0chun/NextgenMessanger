using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Repositories;

public interface IPostRepository : IRepository<Post>
{
    Task<Post?> GetByIdWithAuthorAsync(Guid postId);
    Task<IEnumerable<Post>> GetPublicPostsAsync(int page, int pageSize, string? searchQuery = null);
    Task<IEnumerable<Post>> GetUserPostsAsync(Guid userId, Guid? currentUserId, int page, int pageSize);
    Task<IEnumerable<Post>> GetFeedPostsAsync(Guid userId, IEnumerable<Guid> followingIds, int page, int pageSize);
    Task<int> GetReactionsCountAsync(Guid postId);
    Task<int> GetCommentsCountAsync(Guid postId);
    Task<bool> IsLikedByUserAsync(Guid postId, Guid userId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followeeId);
    Task<bool> CanUserViewPostAsync(Post post, Guid? currentUserId);
    Task<Dictionary<Guid, int>> GetReactionsCountsAsync(IEnumerable<Guid> postIds);
    Task<Dictionary<Guid, int>> GetCommentsCountsAsync(IEnumerable<Guid> postIds);
    Task<HashSet<Guid>> GetLikedPostIdsAsync(IEnumerable<Guid> postIds, Guid userId);
}

