using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Reaction;

public class CreateReactionDto
{
    public ReactionType Type { get; set; } = ReactionType.Like;
}

