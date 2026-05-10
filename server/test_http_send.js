async function testHttpSend() {
  try {
    const res = await fetch('http://localhost:5005/api/shop/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: 'a7699504-2f2b-4e7f-8067-c30380e5e17e',
        sender_id: 'b8048f7f-0e3a-4f64-8bc4-ae73e1ed75a4',
        sender_role: 'customer',
        message_text: 'Hello from HTTP test'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

testHttpSend();
