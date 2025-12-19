namespace NextgenMessanger.Core.DTOs.Post;

public class UpdatePostDto
{
    public string? Content { get; set; }
    public List<string>? MediaUrl { get; set; }
    public string? Visibility { get; set; }
}

