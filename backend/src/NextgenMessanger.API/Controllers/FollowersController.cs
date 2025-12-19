using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/users/{userId}/followers")]
[Authorize]
public class FollowersController : ControllerBase
{
    private readonly IFollowService _followService;

    public FollowersController(IFollowService followService)
    {
        _followService = followService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFollowers(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var followers = await _followService.GetFollowersAsync(userId, page, pageSize);
        return Ok(followers);
    }
}

