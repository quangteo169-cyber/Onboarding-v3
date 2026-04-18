'use client'

import { useState, useRef } from 'react'
import styles from './page.module.css'

const STYLES_OPTIONS = [
  { id: 'friendly',  emoji: '🎉', label: 'Vui vẻ & Thân thiện' },
  { id: 'formal',    emoji: '💼', label: 'Trang trọng' },
  { id: 'energetic', emoji: '🔥', label: 'Năng lượng & Hào hứng' },
  { id: 'creative',  emoji: '✨', label: 'Sáng tạo & Độc đáo' },
]

function Toast({ message, visible }) {
  if (!message) return null
  return (
    <div className={`${styles.toast} ${visible ? styles.toastVisible : ''}`}>
      {message}
    </div>
  )
}

function MemberTag({ member, index, onRemove }) {
  const initials = member.name.split(' ').map(w => w[0]).slice(-2).join('')
  return (
    <div className={styles.memberItem}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.memberInfo}>
        <strong>{member.name}</strong>
        <span>{member.position} · {member.dept}</span>
      </div>
      <button className={styles.removeBtn} onClick={() => onRemove(index)}>✕</button>
    </div>
  )
}

export default function HomePage() {
  const [members, setMembers] = useState([])
  const [selectedStyle, setSelectedStyle] = useState('friendly')
  const [postType, setPostType] = useState('single')
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  // Form state
  const [form, setForm] = useState({
    name: '', position: '', dept: '', dob: '',
    hometown: '', hobby: '', message: '', leader: '',
  })

  // Output state
  const [activeTab, setActiveTab] = useState('post')
  const [postContent, setPostContent] = useState('')
  const [postLoading, setPostLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Toast
  const [toast, setToast] = useState({ msg: '', visible: false })
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToast({ msg, visible: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  const handleFormChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const handleAddMember = () => {
    if (!form.name.trim() || !form.position.trim() || !form.dept.trim()) {
      showToast('⚠️ Vui lòng điền Tên, Chức vụ và Phòng ban')
      return
    }
    setMembers(ms => [...ms, { ...form }])
    setForm({ name: '', position: '', dept: '', dob: '', hometown: '', hobby: '', message: '', leader: '' })
    showToast('✅ Đã thêm: ' + form.name)
  }

  const handleRemoveMember = (i) => {
    setMembers(ms => ms.filter((_, idx) => idx !== i))
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhoto(url)
    showToast('✅ Đã tải ảnh lên')
  }

  const handleGenerate = async (regenerate = false) => {
    if (members.length === 0) return

    setPostLoading(true)
    setPostContent('')
    setImageUrl(null)
    setActiveTab('post')

    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members, style: selectedStyle, postType, regenerate }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPostContent(data.content)
      setGenerated(true)
      showToast('✅ Đã tạo bài viết thành công!')

      // Auto generate image if photo uploaded (for single person)
      if (photo && members.length === 1) {
        handleGenerateImage(members[0])
      }
    } catch (err) {
      showToast('❌ Lỗi: ' + err.message)
    } finally {
      setPostLoading(false)
    }
  }

  const handleGenerateImage = async (member) => {
    if (!member) return
    setImageLoading(true)

    try {
      const fd = new FormData()
      fd.append('member', JSON.stringify(member))
      if (photoFile) fd.append('photo', photoFile)

      const res = await fetch('/api/generate-image', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
      showToast('🖼️ Đã tạo ảnh chào đón!')
    } catch (err) {
      showToast('❌ Lỗi tạo ảnh: ' + err.message)
    } finally {
      setImageLoading(false)
    }
  }

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postContent)
    showToast('📋 Đã copy bài viết!')
  }

  const handleDownloadImage = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `HQ_Welcome_${members[0]?.name?.replace(/\s+/g, '_') || 'card'}.png`
    a.click()
    showToast('⬇️ Đang tải ảnh...')
  }

  const canGenerate = members.length > 0

  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <div className={styles.logoCircle}>HQ</div>
          <span>Onboarding Bot</span>
        </div>
        <span className={styles.navBadge}>HR Tool — Internal</span>
      </nav>

      <div className={styles.app}>
        {/* LEFT PANEL */}
        <aside className={styles.leftPanel}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>✦ Thông tin nhân sự mới</h2>
              <p>Điền thông tin để tạo nội dung chào đón</p>
            </div>
            <div className={styles.panelBody}>

              {/* POST TYPE */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>Loại bài đăng</div>
                <div className={styles.radioGroup}>
                  {[{id:'single',label:'👤 1 người'},{id:'multi',label:'👥 Nhiều người'}].map(opt => (
                    <label key={opt.id} className={`${styles.radioLabel} ${postType===opt.id ? styles.radioSelected : ''}`}>
                      <input type="radio" name="postType" value={opt.id}
                        checked={postType === opt.id}
                        onChange={() => setPostType(opt.id)}
                        className={styles.radioHidden}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* STYLE */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>Phong cách bài viết</div>
                <div className={styles.styleGrid}>
                  {STYLES_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`${styles.styleCard} ${selectedStyle === s.id ? styles.styleSelected : ''}`}
                      onClick={() => setSelectedStyle(s.id)}
                    >
                      <span className={styles.styleEmoji}>{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.divider} />

              {/* MEMBERS LIST */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>Danh sách nhân viên mới</div>

                {members.length > 0 && (
                  <div className={styles.membersList}>
                    {members.map((m, i) => (
                      <MemberTag key={i} member={m} index={i} onRemove={handleRemoveMember} />
                    ))}
                  </div>
                )}

                {/* ADD FORM */}
                <div className={styles.addForm}>
                  <label>Họ và tên <span className={styles.req}>*</span></label>
                  <input type="text" placeholder="Nguyễn Văn A"
                    value={form.name} onChange={handleFormChange('name')} />

                  <label>Chức vụ <span className={styles.req}>*</span></label>
                  <input type="text" placeholder="VD: Thực tập sinh Kế toán"
                    value={form.position} onChange={handleFormChange('position')} />

                  <label>Phòng ban <span className={styles.req}>*</span></label>
                  <input type="text" placeholder="VD: Tài chính - Kế toán"
                    value={form.dept} onChange={handleFormChange('dept')} />

                  <label>Ngày sinh</label>
                  <input type="text" placeholder="DD/MM/YYYY"
                    value={form.dob} onChange={handleFormChange('dob')} />

                  <label>Quê quán</label>
                  <input type="text" placeholder="Hà Nội"
                    value={form.hometown} onChange={handleFormChange('hometown')} />

                  <label>Leader / Người quản lý</label>
                  <input type="text" placeholder="Tên leader"
                    value={form.leader} onChange={handleFormChange('leader')} />

                  <label>Sở thích</label>
                  <input type="text" placeholder="Đọc sách, du lịch, nghe nhạc..."
                    value={form.hobby} onChange={handleFormChange('hobby')} />

                  <label>Lời nhắn</label>
                  <textarea placeholder="Lời nhắn đến đồng nghiệp..."
                    value={form.message} onChange={handleFormChange('message')} />

                  <button className={styles.btnAdd} onClick={handleAddMember}>
                    + Thêm nhân viên
                  </button>
                </div>
              </div>

              <div className={styles.divider} />

              {/* PHOTO */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>Ảnh nhân viên (welcome card)</div>
                {!photo ? (
                  <label className={styles.uploadZone}>
                    <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />
                    <div className={styles.uploadIcon}>🖼️</div>
                    <p>Click hoặc kéo thả ảnh vào đây</p>
                    <small>PNG, JPG — Nên dùng ảnh đã xóa nền</small>
                  </label>
                ) : (
                  <div className={styles.photoPreviewWrap}>
                    <img src={photo} className={styles.photoPreview} alt="Preview" />
                    <button className={styles.photoRemove} onClick={() => { setPhoto(null); setPhotoFile(null) }}>
                      ✕ Đổi ảnh
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.divider} />

              {/* GENERATE */}
              <button
                className={styles.btnPrimary}
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate || postLoading}
              >
                {postLoading ? '⏳ Đang tạo...' : '⚡ Tạo nội dung chào đón'}
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className={styles.rightPanel}>
          {/* TABS */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab==='post' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('post')}>
              📝 Bài viết Telegram
            </button>
            <button className={`${styles.tab} ${activeTab==='image' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('image')}>
              🖼️ Ảnh chào đón
            </button>
          </div>

          {/* POST TAB */}
          {activeTab === 'post' && (
            <div className={styles.outputCard}>
              <div className={styles.outputCardHeader}>
                <div className={styles.telegramBadge}>
                  <div className={styles.telegramDot} />
                  HQ Group — Telegram nội bộ
                </div>
                {postContent && (
                  <span className={styles.timeStamp}>
                    {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className={styles.postBody}>
                {postLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.dotLoader}>
                      <span /><span /><span />
                    </div>
                    <p>Claude đang viết bài...</p>
                  </div>
                ) : postContent ? (
                  <pre className={styles.postText}>{postContent}</pre>
                ) : (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderIcon}>✍️</div>
                    <h3>Chưa có bài viết</h3>
                    <p>Điền thông tin nhân viên và nhấn "Tạo nội dung chào đón"</p>
                  </div>
                )}
              </div>

              {postContent && (
                <div className={styles.outputCardFooter}>
                  <button className={styles.btnSecondary}
                    onClick={() => handleGenerate(true)} disabled={postLoading}>
                    🔄 Viết lại
                  </button>
                  <button className={styles.btnSecondary} onClick={handleCopyPost}>
                    📋 Copy bài viết
                  </button>
                </div>
              )}
            </div>
          )}

          {/* IMAGE TAB */}
          {activeTab === 'image' && (
            <div className={styles.outputCard}>
              <div className={styles.outputCardHeader}>
                <span style={{fontWeight:600}}>🖼️ Ảnh chào đón — Welcome Card</span>
                <div style={{display:'flex', gap:8}}>
                  {members.length === 1 && photo && !imageUrl && (
                    <button className={styles.btnSecondary}
                      onClick={() => handleGenerateImage(members[0])} disabled={imageLoading}>
                      {imageLoading ? '⏳ Đang tạo...' : '🎨 Tạo ảnh'}
                    </button>
                  )}
                  {imageUrl && (
                    <button className={styles.btnSecondary} onClick={handleDownloadImage}>
                      ⬇️ Tải xuống
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.imageBody}>
                {imageLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.dotLoader}>
                      <span /><span /><span />
                    </div>
                    <p>Đang tạo ảnh chào đón...</p>
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} className={styles.welcomeImage} alt="Welcome card" />
                ) : (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderIcon}>🎨</div>
                    <h3>Chưa có ảnh</h3>
                    <p>
                      {!photo
                        ? 'Upload ảnh nhân viên để tạo welcome card'
                        : members.length !== 1
                        ? 'Welcome card chỉ hỗ trợ 1 người — thêm 1 nhân viên'
                        : 'Nhấn "Tạo ảnh" để tạo welcome card'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </>
  )
}
