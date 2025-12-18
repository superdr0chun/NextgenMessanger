namespace NextgenMessanger.Core.Entities;

public class ChatMessage : BaseEntity
{
    public Guid ChatId { get; set; }
    public Guid SenderId { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();

    public Chat Chat { get; set; } = null!;
    public User Sender { get; set; } = null!;
}

