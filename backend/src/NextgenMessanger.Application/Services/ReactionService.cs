using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Reaction;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class ReactionService : IReactionService
{
    private readonly ApplicationDbContext _context;

    public ReactionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReactionDto> AddReactionAsync(Guid postId, Guid userId, CreateReactionDto createDto)
    {
        var existingReaction = await _context.Reactions
            .Include(r => r.User)
                .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(r => r.PostId == postId 
                && r.UserId == userId 
                && !r.Deleted);

        if (existingReaction != null)
        {
            if (existingReaction.Type == createDto.Type)
            {
                return new ReactionDto
                {
                    Id = existingReaction.Id,
                    PostId = existingReaction.PostId,
                    UserId = existingReaction.UserId,
                    Username = existingReaction.User.Username,
                    UserAvatarUrl = existingReaction.User.Profile?.AvatarUrl,
                    Type = existingReaction.Type,
                    CreatedAt = existingReaction.CreatedAt
                };
            }

            existingReaction.Type = createDto.Type;
            existingReaction.UpdatedAt = DateTime.UtcNow;
            existingReaction.Deleted = false;
            existingReaction.DeletedAt = null;
        }
        else
        {
            var reaction = new Core.Entities.Reaction
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Type = createDto.Type,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Deleted = false
            };

            _context.Reactions.Add(reaction);
            await _context.SaveChangesAsync();

            existingReaction = await _context.Reactions
                .Include(r => r.User)
                    .ThenInclude(u => u.Profile)
                .FirstAsync(r => r.Id == reaction.Id);
        }

        await _context.SaveChangesAsync();

        return new ReactionDto
        {
            Id = existingReaction.Id,
            PostId = existingReaction.PostId,
            UserId = existingReaction.UserId,
            Username = existingReaction.User.Username,
            UserAvatarUrl = existingReaction.User.Profile?.AvatarUrl,
            Type = existingReaction.Type,
            CreatedAt = existingReaction.CreatedAt
        };
    }

    public async Task RemoveReactionAsync(Guid postId, Guid userId)
    {
        var reaction = await _context.Reactions
            .FirstOrDefaultAsync(r => r.PostId == postId 
                && r.UserId == userId 
                && !r.Deleted);

        if (reaction == null)
        {
            throw new KeyNotFoundException("Reaction not found");
        }

        reaction.Deleted = true;
        reaction.DeletedAt = DateTime.UtcNow;
        reaction.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<ReactionsSummaryDto> GetReactionsAsync(Guid postId, Guid? currentUserId = null)
    {
        var reactions = await _context.Reactions
            .Include(r => r.User)
                .ThenInclude(u => u.Profile)
            .Where(r => r.PostId == postId && !r.Deleted)
            .ToListAsync();

        var counts = reactions
            .GroupBy(r => r.Type)
            .ToDictionary(g => g.Key, g => g.Count());

        var recentReactions = reactions
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new ReactionDto
            {
                Id = r.Id,
                PostId = r.PostId,
                UserId = r.UserId,
                Username = r.User.Username,
                UserAvatarUrl = r.User.Profile?.AvatarUrl,
                Type = r.Type,
                CreatedAt = r.CreatedAt
            })
            .ToList();

        var currentUserReaction = currentUserId.HasValue
            ? reactions.FirstOrDefault(r => r.UserId == currentUserId)?.Type
            : null;

        return new ReactionsSummaryDto
        {
            Counts = counts,
            RecentReactions = recentReactions,
            CurrentUserReaction = currentUserReaction
        };
    }
}

