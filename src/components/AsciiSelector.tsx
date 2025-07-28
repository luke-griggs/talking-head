import React, { useEffect, useState } from 'react';

const AsciiSelector: React.FC = () => {
  const ascii = `
                 ,     ,  ._  ,
                _.MMmm.mMm_Mm.MMm_:mMMmmm.._  .
           _ .-mmMMMMMMMMMMMMm:MMm:MMMMMMMMMm._
            \`-.mm.MMMMMMM:MMMMMMMmmMMMMMMMMMmm._
         _.mMMMMMmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM"~.
          .MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm._
         _.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm._
      ..mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmmm.
     _.mmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm.
      _.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm_
  .mmMMMMMMMMMMMMMMMMMMMMMMMM' \`MMMMMMMMMMMMMMMMMMMMMMm,
 _.-' _.mMMMMMMMMMMMMMMMMMMM'      \`MMMMMMMMMMMMMMMM""\`
  _,MMMmMMMMMMMMMMMMMMMM'            \`MMMMMMMMMMMMMMmm.
    _.-'MMMMMMMMMMMMMMM.'""'\`.    ,'""\`.MMMMMMMMMMMMMMMM.
   .mmMMMMMMMMMMMMMMMM' <(o)>\`  '<(o)>\` MMMMMMMMMMMMMMMm.
      .MMMMMMMMMMMMMMM                 'MMMMMMMMMMMMMMM:
   ,MMMmMMMMMMMMMMMMM'                 \`MMMMMMMMMMMMmm.
  ,ME:MMMMMMMMMMMMMM_6       -  -       7_MMMMMMMMM:Mm_
  !M:MmmMMMMMMMMMMMMML_                _JMMMMMMMMMm:MMm.
  '':mMMMMMMMMMMMMMMMM\\     ______     /dMMMMMMMMMMM:'Mm.
   ':MMM:MMMMMMMMMMMMMM\\    \`.__.'    /MMMMMM:MMMMMMm: \`
  .M:MMM:MMMMMMMMMMMMMMM\`.          ,'MMMMMMM:MMMMMMMm
    .Mm:mMMMMMMMMMMMMMMM| \`.      .' |MMMMMMm:.MMMMM.
   .Mm:mMMMMMMMMMMMMMMMM|   \`----':: |MMMMMMMmm\`MMMMMm.
     !:mMMMMMMMMMMMMMMMM|      ::::. |MMMMMMMMMMM\`\`mMm.
       !MMMMMMMMM'MMMMMM|      .:::. |MMMMMMMMMMMMM.._
       MMMMMMMMM'MMMM'M/       ::::'  \\MMMMMMMMMMMMMMm,
      .mMMMMMMM'MMMM'MMm.       '     .\`".MMMMMMMMMMMMm.
       !!JmMMM'MMM' \`M:.      ,  ,     .. M.".MMMMMMMMm.
        FMMMMMm.\`M   M..              .. \`Mm   \`"".MMMmm.
        MMMM'    M      ..           ..    \`M      MM\`.M!
        Mm'               ..        ..      M      M'   \\
        /                                                \\
`;

  const [selectionInfo, setSelectionInfo] = useState<string>('');

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const pre = document.getElementById('ascii-art');
        if (pre && range.commonAncestorContainer === pre.firstChild) { // Assuming single text node
          const start = Math.min(range.startOffset, range.endOffset);
          const end = Math.max(range.startOffset, range.endOffset);
          if (start !== end) {
            const selectedText = ascii.substring(start, end);
            setSelectionInfo(`Selected text: "${selectedText}" at indices ${start} to ${end - 1}`);
          } else {
            setSelectionInfo('');
          }
        } else {
          setSelectionInfo('');
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [ascii]);

  return (
    <div>
      <pre id="ascii-art" style={{ whiteSpace: 'pre', fontFamily: 'monospace' }}>
        {ascii}
      </pre>
      <div style={{ marginTop: '20px', fontFamily: 'monospace', minHeight: '100px', backgroundColor: 'black', color: 'white' }}>
        {selectionInfo}
      </div>
    </div>
  );
};

export default AsciiSelector;