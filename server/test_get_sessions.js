async function testGetSessions() {
  try {
    const res = await fetch('http://localhost:5005/api/shop/chat/sessions');
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

testGetSessions();
