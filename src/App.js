import './App.css'

import React from 'react'
import accessToken from './token'
import { ApiAiClient, ApiAiConstants } from 'api-ai-javascript'
import moment from 'moment'

const DialogFlowClient = new ApiAiClient({
    accessToken,
    lang: ApiAiConstants.AVAILABLE_LANGUAGES.PT_BR
})

const AppContainer = ({ children, onInput, onSubmit }) => (
    <div className="app-messages flex-col">
        <div className="res-img logo" />
        <div className="inner flex-col flex">
        { children }
        </div>
        <form action="javascript:void(0)" onSubmit={onSubmit}>
            <input className="text-input" onInput={onInput} />
            <input type="submit" style={{ display: 'none' }} />
        </form>
    </div>
)

const Message = ({ children, datetime, isUser }) => (
    <div className={["message", isUser ? "user" : ""].join(' ')}>
        { children }
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

    componentDidMount() {
        const { sessionId } = AppInit()
        this.setState({ sessionId })
    }

    pushMessage(message, is_user) {
        const datetime = +(new Date())
        this.setState({
            messages: this.state.messages.concat([[ message, datetime, is_user ]]),
            inputText: is_user ? "" : this.state.inputText
        })
    }
    
    async onSendMessage() {
        const { sessionId, inputText } = this.state

        this.pushMessage(this.state.inputText)

        this.setState({ receivingMessage: true })

        try {
            const res = await DialogFlowClient.textRequest(inputText)
            const speech = res.result.fulfillment.speech
            this.pushMessage()
        }
        catch(e) {
            console.log(e)
            alert("Ocorreu um problema com a requisição. Tente novamente mais tarde.")
        }

        this.setState({ receivingMessage: false })
    }

    render() {
        return (
            <div className="App">
                <AppContainer onInput={e => this.setState({ inputText: e.target.value })}
                    onSubmit={() => this.onSendMessage()}>
                {
                    this.state.messages.map(([ message, datetime, is_user ]) =>
                        <Message key={`msg-${datetime}`}
                            datetime={datetime}
                            isUser={is_user}>
                            { message }
                        </Message>
                    )
                }
                </AppContainer>
            </div>
        )
    }
}

export default App
