namespace NextgenMessanger.Core.DTOs.Reaction;

public class ReactionsSummaryDto
{
    public Dictionary<string, int> Counts { get; set; } = new();
    public List<ReactionDto> RecentReactions { get; set; } = new();
    public string? CurrentUserReaction { get; set; }
}

