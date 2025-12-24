using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Reaction;

public class ReactionsSummaryDto
{
    public Dictionary<ReactionType, int> Counts { get; set; } = new();
    public List<ReactionDto> RecentReactions { get; set; } = new();
    public ReactionType? CurrentUserReaction { get; set; }
}

