using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/users/{userId}/following")]
[Authorize]
public class FollowingController : ControllerBase
{
    private readonly IFollowService _followService;

    public FollowingController(IFollowService followService)
    {
        _followService = followService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFollowing(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var following = await _followService.GetFollowingAsync(userId, page, pageSize);
        return Ok(following);
    }
}

