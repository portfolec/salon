import { useEffect } from 'react'
import { useData } from '../context/DataContext'

export default function YandexMetrika() {
  const { content } = useData()
  const id = content.yandexMetrikaId?.trim()

  useEffect(() => {
    if (!id) return

    // Inject the Yandex Metrika init script
    const scriptId = 'ym-init'
    if (document.getElementById(scriptId)) return

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'text/javascript'
    script.innerHTML = `
      (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],
        k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
      ym(${id},'init',{
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
      });
    `
    document.head.appendChild(script)

    // Inject noscript pixel
    const noscriptId = 'ym-noscript'
    if (!document.getElementById(noscriptId)) {
      const noscript = document.createElement('noscript')
      noscript.id = noscriptId
      noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute;left:-9999px;" alt="" /></div>`
      document.body.insertBefore(noscript, document.body.firstChild)
    }
  }, [id])

  return null
}
