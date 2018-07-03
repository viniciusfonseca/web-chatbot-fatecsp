import './App.css'

import React from 'react'
import accessToken from './token'
import { ApiAiClient, ApiAiConstants } from 'api-ai-javascript'
import moment from 'moment'

const DialogFlowClient = new ApiAiClient({
    accessToken,
    lang: ApiAiConstants.AVAILABLE_LANGUAGES.PT_BR
})

const AppContainer = ({
    children,
    onInput,
    onSubmit,
    receivingMessage,
    inputValue,
    scrollMount,
    inputMount,
    onKeyUp,
    onClearHistory
}) => (
    <div className="app-messages flex-col">
        <h1 className="title"> BoeChat </h1>
        <div className="res-img logo" style={{
            alignSelf: 'center',
            backgroundImage: `url(${require('./logo.jpeg')})`
        }} />
        <div className="inner flex-col flex" ref={scrollMount}>
        { children }
        </div>
        <form className="flex-row" action="javascript:void(0)" onSubmit={onSubmit}>
            <input className="text-input flex"
                onInput={onInput}
                value={inputValue}
                placeholder="Digite para conversar..."
                onKeyUp={onKeyUp}
                ref={inputMount} />
            <input type="submit" disabled={receivingMessage} value="Enviar" />
            <button type="button" onClick={onClearHistory}> Limpar Histórico </button>
        </form>
    </div>
)

const Message = ({ children, datetime, isUser }) => (
    <div className={["message", isUser ? "user" : ""].join(' ')}>
        <em>{ isUser ? "Você" : "BoeChat" }</em>
        <div> { children } </div>
        <div className="datetime"> { moment(datetime).format("hh:mm:ss") } </div>
    </div>
)

const AppInit = () => {
    const sessionId = (+(new Date())).toString(16)
    return { sessionId }
}

class App extends React.Component {

    state = {
        sessionId: "",
        messages: [],
        inputText: "",
        receivingMessage: false
    }

    scroll = null
    input = null

    async componentDidMount() {
        const { sessionId } = AppInit()
        this.setState({ sessionId })

        this.pushMessage("Olá, em que posso ajudar?", false)
    }

    pushMessage(message, is_user) {
        const datetime = +(new Date())
        this.setState({
            messages: this.state.messages.concat([[ message, datetime, is_user ]]),
            inputText: is_user ? "" : this.state.inputText
        }, () =>
            setTimeout(() => {
                this.scroll.scrollTop = this.scroll.scrollHeight - this.scroll.clientTop
            }, 200)
        )
    }
    
    async onSendMessage() {
        const { sessionId, inputText } = this.state
        if (!inputText) return

        this.hist_caret = -1

        this.pushMessage(this.state.inputText, true)

        this.setState({ receivingMessage: true })

        try {
            const res = await DialogFlowClient.textRequest(inputText)
            const speech = res.result.fulfillment.speech
            this.pushMessage(speech, false)
        }
        catch (e) {
            console.log(e)
            alert("Ocorreu um problema com a requisição. Tente novamente mais tarde.")
        }

        this.setState({ receivingMessage: false })
    }

    hist_caret = -1
    handleKeyUp(event) {
        const { which } = event
        const user_messages = this.state.messages.filter(([ $0, $1, is_user ]) => is_user) || []

        switch (which) {
            case 40:
                this.hist_caret = Math.max(this.hist_caret - 1, -1)
                break
            case 38:
                this.hist_caret = this.hist_caret === -1 ? user_messages.length - 1 : this.hist_caret - 1
                break
            default:
                this.hist_caret = -1
        }

        if (this.hist_caret >= 0) {
            this.setState({
                inputText: user_messages[this.hist_caret][0] || ""
            })
        }
    }

    onClearHistory() {
        this.setState({ messages: [] })
    }

    render() {
        return (
            <div className="App flex-col center-a center-b" style={{ justifyContent: 'center' }}>
                <AppContainer inputValue={this.state.inputText}
                    onInput={e => this.setState({ inputText: e.target.value })}
                    onKeyUp={event => this.handleKeyUp(event)}
                    onSubmit={() => this.onSendMessage()}
                    onClearHistory={() => this.onClearHistory()}
                    scrollMount={scroll => { this.scroll = scroll }}
                    inputMount={input => { if (!this.input) this.input = input }}>
                {
                    this.state.messages.map(([ message, datetime, is_user ]) =>
                        <Message key={`msg-${datetime}`}
                            datetime={datetime}
                            isUser={is_user}
                            receivingMessage={this.state.receivingMessage}>
                            { message }
                        </Message>
                    )
                }
                <br />
                </AppContainer>
                <p style={{ marginTop: '40px' }}> CHB Innovation © { moment().utc().year() } </p>
            </div>
        )
    }
}

export default App