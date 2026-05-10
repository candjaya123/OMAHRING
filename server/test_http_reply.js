async function testHttpReply() {
  try {
    const res = await fetch('http://localhost:5005/api/shop/chat/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: 'a7699504-2f2b-4e7f-8067-c30380e5e17e',
        sender_id: '88bbfd9d-5075-41b3-b78a-012b5423ec77', // admin id
        message_text: 'Hello from Admin HTTP test'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

testHttpReply();
