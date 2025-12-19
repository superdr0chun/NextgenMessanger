using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Reaction;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/posts/{postId}/reactions")]
[Authorize]
public class ReactionsController : ControllerBase
{
    private readonly IReactionService _reactionService;

    public ReactionsController(IReactionService reactionService)
    {
        _reactionService = reactionService;
    }

    [HttpPost]
    public async Task<IActionResult> AddReaction(Guid postId, [FromBody] CreateReactionDto createDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var reaction = await _reactionService.AddReactionAsync(postId, userId, createDto);
            return Ok(reaction);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete]
    public async Task<IActionResult> RemoveReaction(Guid postId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            await _reactionService.RemoveReactionAsync(postId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetReactions(Guid postId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = null;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var userId))
        {
            currentUserId = userId;
        }

        var reactions = await _reactionService.GetReactionsAsync(postId, currentUserId);
        return Ok(reactions);
    }
}

