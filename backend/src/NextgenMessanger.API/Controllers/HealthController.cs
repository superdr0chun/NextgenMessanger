using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HealthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        try
        {
            // Проверка подключения к БД
            var canConnect = await _context.Database.CanConnectAsync();
            
            if (!canConnect)
            {
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    message = "Database connection failed",
                    timestamp = DateTime.UtcNow
                });
            }

            // Простой запрос для проверки работоспособности БД
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");

            return Ok(new
            {
                status = "healthy",
                message = "Service is operational",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                message = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}

