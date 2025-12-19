namespace NextgenMessanger.Core.DTOs.Post;

public class CreatePostDto
{
    public string? Content { get; set; }
    public List<string>? MediaUrl { get; set; }
    public string Visibility { get; set; } = "public";
}

