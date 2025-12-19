using NextgenMessanger.Core.DTOs.Reaction;

namespace NextgenMessanger.Application.Interfaces;

public interface IReactionService
{
    Task<ReactionDto> AddReactionAsync(Guid postId, Guid userId, CreateReactionDto createDto);
    Task RemoveReactionAsync(Guid postId, Guid userId);
    Task<ReactionsSummaryDto> GetReactionsAsync(Guid postId, Guid? currentUserId = null);
}

