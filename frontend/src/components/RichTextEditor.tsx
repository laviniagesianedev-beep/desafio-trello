import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { LinkOutlined, BoldOutlined, ItalicOutlined, OrderedListOutlined, UnorderedListOutlined, CodeOutlined, CloseOutlined } from '@ant-design/icons';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  editable?: boolean;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Digite aqui...',
  minHeight = 120,
  editable = true
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      {editable && (
        <div className="editor-toolbar">
          <Tooltip title="Negrito">
            <Button
              type="text"
              size="small"
              icon={<BoldOutlined />}
              className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
          </Tooltip>
          <Tooltip title="Itálico">
            <Button
              type="text"
              size="small"
              icon={<ItalicOutlined />}
              className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
          </Tooltip>
          <Tooltip title="Código">
            <Button
              type="text"
              size="small"
              icon={<CodeOutlined />}
              className={`toolbar-button ${editor.isActive('code') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleCode().run()}
            />
          </Tooltip>
          <Tooltip title="Link">
            <Button
              type="text"
              size="small"
              icon={editor.isActive('link') ? <CloseOutlined /> : <LinkOutlined />}
              className={`toolbar-button ${editor.isActive('link') ? 'active' : ''}`}
              onClick={setLink}
            />
          </Tooltip>
          <div className="toolbar-divider" />
          <Tooltip title="Lista">
            <Button
              type="text"
              size="small"
              icon={<UnorderedListOutlined />}
              className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
          </Tooltip>
          <Tooltip title="Lista Numerada">
            <Button
              type="text"
              size="small"
              icon={<OrderedListOutlined />}
              className={`toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Tooltip>
        </div>
      )}
      <EditorContent 
        editor={editor} 
        className="editor-content"
        style={{ minHeight }}
      />
    </div>
  );
}

export function RichTextViewer({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  if (!editor) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <EditorContent editor={editor} className="editor-viewer" />;
}
