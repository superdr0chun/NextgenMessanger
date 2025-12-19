namespace NextgenMessanger.Core.DTOs.ChatMessage;

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ChatId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

