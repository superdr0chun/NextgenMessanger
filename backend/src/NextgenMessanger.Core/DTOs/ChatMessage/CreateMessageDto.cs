namespace NextgenMessanger.Core.DTOs.ChatMessage;

public class CreateMessageDto
{
    public string? Content { get; set; }
    public List<string>? MediaUrl { get; set; }
}

