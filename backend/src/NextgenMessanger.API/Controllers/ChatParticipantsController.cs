using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/chats/{chatId}/participants")]
[Authorize]
public class ChatParticipantsController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatParticipantsController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> AddParticipant(Guid chatId, Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            await _chatService.AddParticipantAsync(chatId, currentUserId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveParticipant(Guid chatId, Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        try
        {
            await _chatService.RemoveParticipantAsync(chatId, currentUserId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

