// frontend/src/components/compose/ImageUpload.tsx
import { useRef, useState } from 'react'
import { Button, Typography, Flex } from 'antd'
import { PictureOutlined, CloseOutlined } from '@ant-design/icons'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUpload({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1500
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
            else { width = Math.round((width * MAX) / height); height = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const readFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      compressImage(file).then(dataUrl => onChange([...images, dataUrl]))
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    readFiles(e.dataTransfer.files)
  }

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx))

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#16a34a' : '#d1d5db'}`,
          borderRadius: 8,
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#f0fdf4' : '#fafafa',
          transition: 'all 0.2s',
        }}
      >
        <PictureOutlined style={{ fontSize: 24, color: '#9ca3af' }} />
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
          Kéo thả ảnh hoặc click để chọn
        </Typography.Text>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => readFiles(e.target.files)}
        />
      </div>
      {images.length > 0 && (
        <Flex gap={8} wrap="wrap" style={{ marginTop: 10 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={src}
                alt=""
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
              />
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
                onClick={e => { e.stopPropagation(); remove(i) }}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  padding: 0, minWidth: 0, fontSize: 10,
                }}
              />
            </div>
          ))}
        </Flex>
      )}
    </div>
  )
}
