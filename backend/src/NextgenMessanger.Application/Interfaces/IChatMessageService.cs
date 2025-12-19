using NextgenMessanger.Core.DTOs.ChatMessage;

namespace NextgenMessanger.Application.Interfaces;

public interface IChatMessageService
{
    Task<MessageDto> SendMessageAsync(Guid chatId, Guid userId, CreateMessageDto createDto);
    Task<IEnumerable<MessageDto>> GetMessagesAsync(Guid chatId, Guid userId, int page = 1, int pageSize = 20, DateTime? before = null);
    Task DeleteMessageAsync(Guid messageId, Guid userId);
}

