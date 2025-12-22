using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StatsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var stats = new
            {
                Users = new
                {
                    Total = await _context.Users.CountAsync(u => !u.Deleted),
                    Active = await _context.Users.CountAsync(u => !u.Deleted && u.Status == "active")
                },
                Posts = new
                {
                    Total = await _context.Posts.CountAsync(p => !p.Deleted),
                    Public = await _context.Posts.CountAsync(p => !p.Deleted && p.Visibility == "public")
                },
                Comments = await _context.Comments.CountAsync(c => !c.Deleted),
                Reactions = await _context.Reactions.CountAsync(r => !r.Deleted),
                Follows = await _context.Follows.CountAsync(f => !f.Deleted && f.Status == "accepted"),
                Chats = await _context.Chats.CountAsync(c => !c.Deleted),
                Messages = await _context.ChatMessages.CountAsync(m => !m.Deleted),
                Notifications = await _context.Notifications.CountAsync(n => !n.Deleted),
                UnreadNotifications = await _context.Notifications.CountAsync(n => !n.Deleted && !n.IsRead)
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve statistics", error = ex.Message });
        }
    }
}

