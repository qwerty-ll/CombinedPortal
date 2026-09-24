// Lets any page open the ВИТШик chat panel without importing the widget.
export const OPEN_CHAT_EVENT = 'portal:open-chat';

export const openChat = () => window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
