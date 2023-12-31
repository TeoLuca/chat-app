const socket = io()

// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client

// elementes
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')

const $locationButton = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTempate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // get height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url : message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTempate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable form
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        //enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', coordinates, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location sent!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})