import React from 'react';
import './ChatPage.css';

const ChatPage = () => {
    return (
        <div className="chat-page">
            {/* Header */}
            <header className="chat-header">
                <div className="logo">NextGen</div>
                <div className="search-bar">
                    <input type="text" placeholder="Search..." />
                    <button>🔍</button>
                </div>
                <div className="notifications">🔔</div>
            </header>

            {/* Main Container */}
            <div className="container">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="user-profile">
                        <div className="avatar"></div>
                        <div className="name">Name Profile</div>
                        <div className="status">3D Designer</div>
                    </div>
                    <nav>
                        <ul>
                            <li><a href="#">Friends</a></li>
                            <li><a href="#">Music</a></li>
                            <li><a href="#">News Feed</a></li>
                            <li><a href="#" className="active">Chat</a></li>
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {/* Chat List */}
                    <section className="chat-list-section">
                        <div className="search-header">
                            <input type="text" placeholder="Search..." />
                            <button>+</button>
                        </div>
                        <div className="chat-items">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="chat-item">
                                    <div className="avatar"></div>
                                    <div className="chat-info">
                                        <div className="name">Name Profile</div>
                                        <div className="message">аххахахахахаах</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Chat Area */}
                    <section className="chat-area">
                        <div className="chat-header">
                            <div className="chat-title">Name Chat</div>
                            <div className="participants">3 participante</div>
                            <div className="options">⋯</div>
                        </div>
                        <div className="messages">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="message-bubble">
                                    <div className="avatar"></div>
                                    <div className="message-content">
                                        <div className="sender">Name Profile</div>
                                        <div className="text">ЧМОШНИК</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="input-area">
                            <input type="text" placeholder="Text a message..." />
                            <button>📎</button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default ChatPage;