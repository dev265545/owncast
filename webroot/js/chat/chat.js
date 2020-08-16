import { h, Component } from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';
// Initialize htm with Preact
const html = htm.bind(h);

import { getLocalStorage, setLocalStorage } from '../utils.js';
import { KEY_CHAT_FIRST_MESSAGE_SENT } from '../utils/chat.js';
import SOCKET_MESSAGE_TYPES from '../utils/socket-message-types.js';
import Message from './message.js';
import ChatInput from './chat-input.js';
import { CALLBACKS } from '../websocket.js';


import { URL_CHAT_HISTORY, setVHvar, hasTouchScreen } from '../utils.js';

export default class Chat extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      inputEnabled: true,
      messages: [],
      chatUserNames: [],
    };

    this.websocket = null;

    this.getChatHistory = this.getChatHistory.bind(this);
    this.receivedWebsocketMessage = this.receivedWebsocketMessage.bind(this);
    this.websocketDisconnected = this.websocketDisconnected.bind(this);

    // this.handleSubmitChatButton = this.handleSubmitChatButton.bind(this);
    this.submitChat = this.submitChat.bind(this);
  }

  componentDidMount() {
   this.setupWebSocketCallbacks();
   this.getChatHistory();

   if (hasTouchScreen()) {
    setVHvar();
    window.addEventListener("orientationchange", setVHvar);
    // this.tagAppContainer.classList.add('touch-screen');
    }
  }

  componentDidUpdate(prevProps) {
    const { username: prevName } = prevProps;
    const { username, userAvatarImage } = this.props;
    // if username updated, send a message
    if (prevName !== username) {
      this.sendUsernameChange(prevName, username, userAvatarImage);
    }
  }

  setupWebSocketCallbacks() {
    this.websocket = this.props.websocket;
    if (this.websocket) {
      this.websocket.addListener(CALLBACKS.RAW_WEBSOCKET_MESSAGE_RECEIVED, this.receivedWebsocketMessage);
      this.websocket.addListener(CALLBACKS.WEBSOCKET_DISCONNECTED, this.websocketDisconnected);
    }

  }

  // fetch chat history
  getChatHistory() {
    fetch(URL_CHAT_HISTORY)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.ok}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("=====chat history data",data)
      this.setState({
        messages: data,
      });
      // const formattedMessages = data.map(function (message) {
      //   return new Message(message);
      // })
      // this.vueApp.messages = formattedMessages.concat(this.vueApp.messages);
    })
    .catch(error => {
      // this.handleNetworkingError(`Fetch getChatHistory: ${error}`);
    });
  }



  sendUsernameChange(oldName, newName, image) {
		const nameChange = {
			type: SOCKET_MESSAGE_TYPES.NAME_CHANGE,
			oldName: oldName,
			newName: newName,
			image: image,
		};
		this.websocket.send(nameChange);
  }



  receivedWebsocketMessage(message) {
    this.addMessage(message);
    // if (model.type === SOCKET_MESSAGE_TYPES.CHAT) {
    //   const message = new Message(model);
    //   this.addMessage(message);
    // } else if (model.type === SOCKET_MESSAGE_TYPES.NAME_CHANGE) {
    //   this.addMessage(model);
    // }
  }

  // if incoming message has same id as existing message, don't add it
  addMessage(message) {
    const { messages: curMessages } = this.state;
    const existing = curMessages.filter(function (item) {
      return item.id === message.id;
    })
    if (existing.length === 0 || !existing) {
      const newState = {
        messages: [...curMessages, message],
      };
      const updatedChatUserNames = this.updateAuthorList(message);
      if (updatedChatUserNames.length) {
        newState.chatUserNames = [...updatedChatUserNames];
      }
      this.setState(newState);
    }

    // todo - jump to bottom
    // jumpToBottom(this.scrollableMessagesContainer);
  }
  websocketDisconnected() {
    // this.websocket = null;
    this.disableChat()
  }

  handleSubmitChatButton(event) {
    const { inputValue } = this.state;
		var value = inputValue.trim();
		if (value) {
			this.submitChat(value);
			event.preventDefault();
		return false;
		}
		event.preventDefault();
		return false;
  }

  submitChat(content) {
		if (!content) {
			return;
    }
    const { username, userAvatarImage } = this.props;
    const message = {
      body: content,
			author: username,
			image: userAvatarImage,
			type: SOCKET_MESSAGE_TYPES.CHAT,
    };
		// var message = new Message({
		// 	body: content,
		// 	author: username,
		// 	image: userAvatarImage,
		// 	type: SOCKET_MESSAGE_TYPES.CHAT,
		// });
		this.websocket.send(message);

    // clear out things.
    // const newStates = {
    //   inputValue: '',
    //   inputWarning: '',
    // };
		// this.formMessageInput.innerHTML = '';
		// this.tagMessageFormWarning.innerText = '';

		// const hasSentFirstChatMessage = getLocalStorage(KEY_CHAT_FIRST_MESSAGE_SENT);
		// if (!this.state.hasSentFirstChatMessage) {
    //   newStates.hasSentFirstChatMessage = true;
    //   setLocalStorage(KEY_CHAT_FIRST_MESSAGE_SENT, true);
		// 	// this.setChatPlaceholderText();
    // }
    // this.setState(newStates);
  }

  disableChat() {
    this.setState({
      inputEnabled: false,
    });
		// if (this.formMessageInput) {
		// 	this.formMessageInput.contentEditable = false;
		// 	this.formMessageInput.innerHTML = '';
		// 	this.formMessageInput.setAttribute("placeholder", CHAT_PLACEHOLDER_OFFLINE);
		// }
	}

	enableChat() {
    this.setState({
      inputEnabled: true,
    });
	}

  updateAuthorList(message) {
    const { type } = message;
    const username = '';
    const nameList = this.state.chatUserNames;

    if (
      type === SOCKET_MESSAGE_TYPES.CHAT &&
      !nameList.includes(message.author)
    ) {
      return nameList.push(message.author);
    } else if (type === SOCKET_MESSAGE_TYPES.NAME_CHANGE) {
      const { oldName, newName } = message;
      const oldNameIndex = nameList.indexOf(oldName);
      return nameList.splice(oldNameIndex, 1, newName);
    }
    return [];
  }



  render(props, state) {
    const { username } = props;
    const { messages, inputEnabled, chatUserNames } = state;

    return (
      html`
        <section id="chat-container-wrap" class="flex">
          <div id="chat-container" class="bg-gray-800">
            <div id="messages-container">
              ${
                messages.map(message => (html`<${Message} message=${message} username=${username} />`))
              }
              messages..
            </div>
            <${ChatInput}
              chatUserNames=${chatUserNames}
              inputEnabled=${inputEnabled}
              handleSendMessage=${this.submitChat}
            />
          </div>
        </section>
    `);
  }

}
