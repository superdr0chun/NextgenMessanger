using NextgenMessanger.Core.DTOs.Follow;

namespace NextgenMessanger.Application.Interfaces;

public interface IFollowService
{
    Task<FollowDto> FollowUserAsync(Guid followerId, Guid followeeId);
    Task UnfollowUserAsync(Guid followerId, Guid followeeId);
    Task<IEnumerable<FollowDto>> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<IEnumerable<FollowDto>> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followeeId);
}

