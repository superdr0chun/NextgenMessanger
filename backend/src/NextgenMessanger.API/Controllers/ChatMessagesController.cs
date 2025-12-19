using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.ChatMessage;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/chats/{chatId}/messages")]
[Authorize]
public class ChatMessagesController : ControllerBase
{
    private readonly IChatMessageService _messageService;

    public ChatMessagesController(IChatMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage(Guid chatId, [FromBody] CreateMessageDto createDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var message = await _messageService.SendMessageAsync(chatId, userId, createDto);
            return CreatedAtAction(nameof(GetMessages), new { chatId }, message);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages(Guid chatId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] DateTime? before = null)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var messages = await _messageService.GetMessagesAsync(chatId, userId, page, pageSize, before);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}

