using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Follow;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class FollowService : IFollowService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public FollowService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<FollowDto> FollowUserAsync(Guid followerId, Guid followeeId)
    {
        if (followerId == followeeId)
        {
            throw new InvalidOperationException("Cannot follow yourself");
        }

        var existingFollow = await _context.Follows
            .Include(f => f.Follower)
                .ThenInclude(u => u.Profile)
            .Include(f => f.Followee)
                .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(f => f.FollowerId == followerId 
                && f.FolloweeId == followeeId);

        if (existingFollow != null)
        {
            if (!existingFollow.Deleted)
            {
                if (existingFollow.Status == "accepted")
                {
                    return new FollowDto
                    {
                        Id = existingFollow.Id,
                        FollowerId = existingFollow.FollowerId,
                        FollowerUsername = existingFollow.Follower.Username,
                        FollowerAvatarUrl = existingFollow.Follower.Profile?.AvatarUrl,
                        FolloweeId = existingFollow.FolloweeId,
                        FolloweeUsername = existingFollow.Followee.Username,
                        FolloweeAvatarUrl = existingFollow.Followee.Profile?.AvatarUrl,
                        Status = existingFollow.Status,
                        CreatedAt = existingFollow.CreatedAt
                    };
                }

                existingFollow.Status = "accepted";
                existingFollow.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existingFollow.Deleted = false;
                existingFollow.DeletedAt = null;
                existingFollow.Status = "accepted";
                existingFollow.UpdatedAt = DateTime.UtcNow;

                // Если подписка была удалена и теперь восстанавливается, создать уведомление
                await _notificationService.CreateNotificationAsync(
                    followeeId,
                    "new_follower",
                    new { follower_id = followerId.ToString() });
            }
        }
        else
        {
            var follow = new Core.Entities.Follow
            {
                Id = Guid.NewGuid(),
                FollowerId = followerId,
                FolloweeId = followeeId,
                Status = "accepted",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Deleted = false
            };

            _context.Follows.Add(follow);
            await _context.SaveChangesAsync();

            existingFollow = await _context.Follows
                .Include(f => f.Follower)
                    .ThenInclude(u => u.Profile)
                .Include(f => f.Followee)
                    .ThenInclude(u => u.Profile)
                .FirstAsync(f => f.Id == follow.Id);

            // Создать уведомление для пользователя, на которого подписались
            await _notificationService.CreateNotificationAsync(
                followeeId,
                "new_follower",
                new { follower_id = followerId.ToString() });
        }

        await _context.SaveChangesAsync();

        return new FollowDto
        {
            Id = existingFollow.Id,
            FollowerId = existingFollow.FollowerId,
            FollowerUsername = existingFollow.Follower.Username,
            FollowerAvatarUrl = existingFollow.Follower.Profile?.AvatarUrl,
            FolloweeId = existingFollow.FolloweeId,
            FolloweeUsername = existingFollow.Followee.Username,
            FolloweeAvatarUrl = existingFollow.Followee.Profile?.AvatarUrl,
            Status = existingFollow.Status,
            CreatedAt = existingFollow.CreatedAt
        };
    }

    public async Task UnfollowUserAsync(Guid followerId, Guid followeeId)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId 
                && f.FolloweeId == followeeId 
                && !f.Deleted);

        if (follow == null)
        {
            throw new KeyNotFoundException("Follow relationship not found");
        }

        follow.Deleted = true;
        follow.DeletedAt = DateTime.UtcNow;
        follow.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<FollowDto>> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var follows = await _context.Follows
            .Include(f => f.Follower)
                .ThenInclude(u => u.Profile)
            .Include(f => f.Followee)
                .ThenInclude(u => u.Profile)
            .Where(f => f.FolloweeId == userId 
                && f.Status == "accepted" 
                && !f.Deleted)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return follows.Select(f => new FollowDto
        {
            Id = f.Id,
            FollowerId = f.FollowerId,
            FollowerUsername = f.Follower.Username,
            FollowerAvatarUrl = f.Follower.Profile?.AvatarUrl,
            FolloweeId = f.FolloweeId,
            FolloweeUsername = f.Followee.Username,
            FolloweeAvatarUrl = f.Followee.Profile?.AvatarUrl,
            Status = f.Status,
            CreatedAt = f.CreatedAt
        });
    }

    public async Task<IEnumerable<FollowDto>> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var follows = await _context.Follows
            .Include(f => f.Follower)
                .ThenInclude(u => u.Profile)
            .Include(f => f.Followee)
                .ThenInclude(u => u.Profile)
            .Where(f => f.FollowerId == userId 
                && f.Status == "accepted" 
                && !f.Deleted)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return follows.Select(f => new FollowDto
        {
            Id = f.Id,
            FollowerId = f.FollowerId,
            FollowerUsername = f.Follower.Username,
            FollowerAvatarUrl = f.Follower.Profile?.AvatarUrl,
            FolloweeId = f.FolloweeId,
            FolloweeUsername = f.Followee.Username,
            FolloweeAvatarUrl = f.Followee.Profile?.AvatarUrl,
            Status = f.Status,
            CreatedAt = f.CreatedAt
        });
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followeeId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId 
                && f.FolloweeId == followeeId 
                && f.Status == "accepted" 
                && !f.Deleted);
    }
}

