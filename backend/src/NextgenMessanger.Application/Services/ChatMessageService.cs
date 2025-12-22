using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.ChatMessage;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class ChatMessageService : IChatMessageService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public ChatMessageService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<MessageDto> SendMessageAsync(Guid chatId, Guid userId, CreateMessageDto createDto)
    {
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        var message = new Core.Entities.ChatMessage
        {
            Id = Guid.NewGuid(),
            ChatId = chatId,
            SenderId = userId,
            Content = createDto.Content,
            MediaUrl = createDto.MediaUrl ?? new List<string>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.ChatMessages.Add(message);

        var chat = await _context.Chats
            .FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat != null)
        {
            chat.LastMessageAt = DateTime.UtcNow;
            chat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Создать уведомления для всех участников чата (кроме отправителя)
        var participants = await _context.ChatParticipants
            .Where(cp => cp.ChatId == chatId 
                && cp.UserId != userId 
                && !cp.Deleted 
                && cp.LeftAt == null)
            .Select(cp => cp.UserId)
            .ToListAsync();

        foreach (var participantId in participants)
        {
            await _notificationService.CreateNotificationAsync(
                participantId,
                "new_message",
                new { chat_id = chatId.ToString(), sender_id = userId.ToString(), message_id = message.Id.ToString() });
        }

        var messageWithSender = await _context.ChatMessages
            .Include(m => m.Sender)
                .ThenInclude(u => u.Profile)
            .FirstAsync(m => m.Id == message.Id);

        return new MessageDto
        {
            Id = messageWithSender.Id,
            ChatId = messageWithSender.ChatId,
            SenderId = messageWithSender.SenderId,
            SenderUsername = messageWithSender.Sender.Username,
            SenderAvatarUrl = messageWithSender.Sender.Profile?.AvatarUrl,
            Content = messageWithSender.Content,
            MediaUrl = messageWithSender.MediaUrl,
            CreatedAt = messageWithSender.CreatedAt,
            UpdatedAt = messageWithSender.UpdatedAt
        };
    }

    public async Task<IEnumerable<MessageDto>> GetMessagesAsync(Guid chatId, Guid userId, int page = 1, int pageSize = 20, DateTime? before = null)
    {
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        var query = _context.ChatMessages
            .Include(m => m.Sender)
                .ThenInclude(u => u.Profile)
            .Where(m => m.ChatId == chatId && !m.Deleted);

        if (before.HasValue)
        {
            query = query.Where(m => m.CreatedAt < before.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(m => new MessageDto
        {
            Id = m.Id,
            ChatId = m.ChatId,
            SenderId = m.SenderId,
            SenderUsername = m.Sender.Username,
            SenderAvatarUrl = m.Sender.Profile?.AvatarUrl,
            Content = m.Content,
            MediaUrl = m.MediaUrl,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        });
    }

    public async Task DeleteMessageAsync(Guid messageId, Guid userId)
    {
        var message = await _context.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId && !m.Deleted);

        if (message == null)
        {
            throw new KeyNotFoundException("Message not found");
        }

        if (message.SenderId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own messages");
        }

        message.Deleted = true;
        message.DeletedAt = DateTime.UtcNow;
        message.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}

