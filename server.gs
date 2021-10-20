function doGet(e){
  if(e.parameter.post && e.parameter.page){
    writePost(e.parameter.post,e.parameter.page)
  }
   return ContentService.createTextOutput(getScript(e.parameter.page,e.parameter.post)).setMimeType(ContentService.MimeType.JAVASCRIPT);
}


const writePost = (post,page)=>{
  const sheet = SpreadsheetApp.getActive().getSheets()[0];
  if(!sheet.getLastColumn())
    return [];
  const pages = sheet.getRange(1,1, 1, sheet.getLastColumn()).getValues().flat().filter(entry=>entry !== '');
  let columnNumber;
  if(pages.includes(page)) columnNumber = pages.indexOf(page)+1;
  else{
    columnNumber = sheet.getLastColumn()+1;
    sheet.getRange(1, columnNumber).setValue(page);
  }
  let rowNumber = readColumn(columnNumber).length+1
  sheet.getRange(rowNumber, columnNumber).setValue(post);
}


function readColumn(column){
  const sheet = SpreadsheetApp.getActive().getSheets()[0];
  if(!sheet.getLastRow())
    return [];
  return sheet.getRange(1,column, sheet.getLastRow(), 1).getValues().flat().filter(entry=>entry !== '');
}
const getComments = (page)=>{
  const sheet = SpreadsheetApp.getActive().getSheets()[0];
  if(!sheet.getLastColumn())
    return [];
  const pages = sheet.getRange(1,1, 1, sheet.getLastColumn()).getValues().flat().filter(entry=>entry !== '');
  if(pages.includes(page)){
    const comments = readColumn(pages.indexOf(page)+1);
    comments.shift();
    return comments;
  }
  return [];
}

getScript = (page,post)=>{
  if(post) return getPostScript(page);
  return getCommentsScript(page);
}

const getCommentsScript = (page)=>{
  return getBaseScript(page).replace('{{entry}}',`window.addEventListener('load',init);`);;
}
const getPostScript = (page)=>{
  return getBaseScript(page).replace('{{entry}}',`init();scrollToBottom();`);;
}

const getBaseScript = (page)=>{
  return `(()=>{
  let commentBody;
  const init = ()=>{
    let data = ${JSON.stringify(getComments(page))};
    commentBody = document.getElementById('gs_comments')
    commentBody.innerHTML = '';
    makeCommentHeader();
    //commentBody.innerText += JSON.stringify(data);
    data.forEach(comment=>makeComment(JSON.parse(comment)));
    makeCommentBox();
  }

  const makeCommentHeader= ()=>{
    const commentHeader = document.createElement('h1');
    commentHeader.innerText = 'Comments';
    commentBody.appendChild(commentHeader);
  }
  const makeComment = comment=>{
    const commentDiv = document.createElement('div');
    commentDiv.style.width="90%";
    commentDiv.style.borderColor = '#DDDDDD';
    commentDiv.style.borderStyle='solid'
    commentDiv.style.padding='15px';
    commentDiv.style.marginBottom='10px';
    const commentUser = document.createElement('div');
    const commentText = document.createElement('div');
    commentUser.innerText = comment.username + ':';
    commentText.innerText = comment.comment;
    commentDiv.appendChild(commentUser);
    commentDiv.appendChild(commentText);
    commentBody.appendChild(commentDiv);
  }
  const serializeComment = (username,textbox)=>{
    return JSON.stringify({
      username:username.value,
      comment:textbox.value
    })
  }
  const makeCommentBox = ()=>{
    const commentBox = document.createElement('div');
    const username = document.createElement('input');
    username.style.backgroundColor = '#222222';
    username.style.color='#DDDDDD';
    username.style.font='inherit';
    username.style.borderColor = '#DDDDDD';
    username.style.borderStyle='solid';
    username.style.padding='5px';
    username.style.marginBottom='10px';
    username.placeholder='Username';
    const text = document.createElement('textarea');
    text.placeholder = 'Write a comment...';
    text.style.width="90%";
    text.style.height="5em";
    text.style.backgroundColor = '#222222';
    text.style.borderColor = '#DDDDDD';
    text.style.font='inherit';
    text.style.borderStyle='solid'
    text.style.padding='5px';
    text.style.marginBottom='10px';
    text.style.color='#DDDDDD';
    const submit = document.createElement('input');
    submit.type = 'button';
    submit.value = 'Post';
    submit.style.backgroundColor = '#222222';
    submit.style.color='#DDDDDD';
    submit.style.borderColor = '#DDDDDD';
    submit.style.borderStyle='solid'
    submit.style.marginBottom='10px';
    submit.style.font='inherit';
    submit.style.cursor = 'pointer';
    submit.addEventListener('click',()=>{
      if(!username.value || !text.value) return;
      submit.value = 'Posting...';
      const script = document.createElement('script');
      script.src=document.getElementById('gs_script').src + '&post=' + serializeComment(username,text);
      document.body.appendChild(script);
    });
    commentBox.appendChild(username);
    commentBox.appendChild(document.createElement('br'));
    commentBox.appendChild(text);
    commentBox.appendChild(document.createElement('br'));
    commentBox.appendChild(submit);
    commentBody.appendChild(commentBox);
    commentBody.appendChild(document.createElement('br'));
  }
  const scrollToBottom = ()=>{
    window.scrollTo(0,document.body.scrollHeight);
  }
  {{entry}}
  })();
`
}
