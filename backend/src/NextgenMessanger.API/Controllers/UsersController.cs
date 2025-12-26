using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.User;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IPostService _postService;

    public UsersController(IUserService userService, IPostService postService)
    {
        _userService = userService;
        _postService = postService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await _userService.SearchUsersAsync(q, page, pageSize);
        return Ok(users);
    }

    [HttpGet("{idOrUsername}")]
    public async Task<IActionResult> GetUser(string idOrUsername)
    {
        UserDto? user = null;
        
        if (Guid.TryParse(idOrUsername, out var userId))
        {
            user = await _userService.GetByIdAsync(userId);
        }
        else
        {
            user = await _userService.GetByUsernameAsync(idOrUsername);
        }

        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto updateDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (userId != id)
        {
            return Forbid();
        }

        try
        {
            var user = await _userService.UpdateUserAsync(id, updateDto);
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id}/posts")]
    public async Task<IActionResult> GetUserPosts(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = null;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var userId))
        {
            currentUserId = userId;
        }

        var posts = await _postService.GetUserPostsAsync(id, page, pageSize, currentUserId);
        return Ok(posts);
    }
}

