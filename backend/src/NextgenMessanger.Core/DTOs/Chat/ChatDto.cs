using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Chat;

public class ChatDto
{
    public Guid Id { get; set; }
    public ChatType Type { get; set; }
    public string? Title { get; set; }
    public Guid CreatedBy { get; set; }
    public string? CreatedByUsername { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public List<ChatParticipantDto> Participants { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

