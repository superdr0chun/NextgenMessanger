using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Entities;

public class ChatParticipant : BaseEntity
{
    public Guid ChatId { get; set; }
    public Guid UserId { get; set; }
    public ChatParticipantRole Role { get; set; } = ChatParticipantRole.Member;
    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public DateTime? LastReadAt { get; set; }

    public Chat Chat { get; set; } = null!;
    public User User { get; set; } = null!;
}

