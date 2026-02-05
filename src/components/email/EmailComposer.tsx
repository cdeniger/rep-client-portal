import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

interface EmailComposerProps {
    initialContent?: string;
    onUpdate: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const Button = ({ onClick, isActive, children, title }: any) => (
        <button
            onClick={onClick}
            title={title}
            className={clsx(
                "p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-600",
                isActive && "bg-slate-200 text-slate-900"
            )}
            type="button"
        >
            {children}
        </button>
    );

    return (
        <div className="flex items-center gap-1 border-b border-slate-200 p-2 bg-slate-50 rounded-t-lg">
            <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
            >
                <Bold size={16} />
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
            >
                <Italic size={16} />
            </Button>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
            >
                <List size={16} />
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
            >
                <ListOrdered size={16} />
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Quote"
            >
                <Quote size={16} />
            </Button>
        </div>
    );
};

export const EmailComposer = ({ initialContent = '', onUpdate, placeholder = 'Write your response...', disabled = false }: EmailComposerProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: initialContent,
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-slate-700',
            },
        },
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && initialContent && editor.isEmpty) {
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    return (
        <div className={clsx("border border-slate-200 rounded-lg shadow-sm bg-white focus-within:ring-2 ring-oxford-green/20 transition-shadow", disabled && "opacity-60 pointer-events-none")}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};
