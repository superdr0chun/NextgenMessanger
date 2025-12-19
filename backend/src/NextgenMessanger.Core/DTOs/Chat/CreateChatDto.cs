namespace NextgenMessanger.Core.DTOs.Chat;

public class CreateChatDto
{
    public string Type { get; set; } = "direct";
    public string? Title { get; set; }
    public List<Guid> ParticipantIds { get; set; } = new();
}

