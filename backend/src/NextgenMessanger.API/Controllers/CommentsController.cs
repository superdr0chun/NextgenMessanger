using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Comment;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/posts/{postId}/comments")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateComment(Guid postId, [FromBody] CreateCommentDto createDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var comment = await _commentService.CreateCommentAsync(postId, userId, createDto);
            return CreatedAtAction(nameof(GetComments), new { postId }, comment);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid postId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var comments = await _commentService.GetCommentsAsync(postId, page, pageSize);
        return Ok(comments);
    }
}

