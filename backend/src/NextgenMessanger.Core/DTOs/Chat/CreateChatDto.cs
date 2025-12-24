using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Chat;

public class CreateChatDto
{
    public ChatType Type { get; set; } = ChatType.Direct;
    public string? Title { get; set; }
    public List<Guid> ParticipantIds { get; set; } = new();
}

