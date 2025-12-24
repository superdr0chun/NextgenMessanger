using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Entities;

public class Chat : BaseEntity
{
    public ChatType Type { get; set; } = ChatType.Direct;
    public string? Title { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public Guid? LastMessageId { get; set; }

    public User? Creator { get; set; }
    public ChatMessage? LastMessage { get; set; }
    public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

