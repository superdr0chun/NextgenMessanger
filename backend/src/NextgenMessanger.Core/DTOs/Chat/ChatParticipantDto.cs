using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Chat;

public class ChatParticipantDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public ChatParticipantRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}

