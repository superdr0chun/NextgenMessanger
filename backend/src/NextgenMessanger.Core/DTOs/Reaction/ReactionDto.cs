using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Reaction;

public class ReactionDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public ReactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }
}

