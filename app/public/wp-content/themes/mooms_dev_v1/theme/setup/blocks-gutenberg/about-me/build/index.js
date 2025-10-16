(function(wp){
  const { registerBlockType } = wp.blocks;
  const { InspectorControls, MediaUpload, RichText } = wp.blockEditor || wp.editor;
  const { PanelBody, Button } = wp.components;

  function register(){
  console.log('[MMS About Me Block] Registering block...');
  registerBlockType('mms/about-me', {
    title: 'About Me (Visual)',
    icon: 'admin-users',
    category: 'mms-blocks',
    attributes: {
      circle: { type: 'string', default: 'about me - about me - about me - about me -' },
      imageID: { type: 'number', default: 0 },
      imageURL: { type: 'string', default: '' },
      title: { type: 'string', default: 'About me' },
      desc: { type: 'string', default: '' }
    },
    edit: function(props){
      console.log('[MMS About Me Block] Edit function called', props);
      const attrs = props.attributes;

      function onSelectImage(media){
        props.setAttributes({ imageID: media.id, imageURL: media.url });
      }

      return [
        wp.element.createElement(InspectorControls, {},
          wp.element.createElement(PanelBody, { title: 'Settings' },
            wp.element.createElement('div', { style: { marginBottom: '16px' } },
              wp.element.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '600' } }, 'Circle Text'),
              wp.element.createElement('input', {
                type: 'text',
                value: attrs.circle,
                onChange: (e) => props.setAttributes({ circle: e.target.value }),
                placeholder: 'about me - about me - ...',
                style: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }
              })
            )
          )
        ),

        wp.element.createElement('section', { className: 'block-about' },
          wp.element.createElement('div', { className: 'block-about__head' },
            wp.element.createElement('div', { className: 'scroll-circle' },
              wp.element.createElement('svg', { viewBox: '0 0 200 200' },
                wp.element.createElement('path', { id: 'circlePath', d: 'M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0', fill: 'none' }),
                wp.element.createElement('text', {},
                  wp.element.createElement('textPath', { href: '#circlePath', startOffset: '0' }, attrs.circle)
                )
              ),
              wp.element.createElement('div', { className: 'arrow' })
            ),
            wp.element.createElement('div', { className: 'block-about__img' },
              wp.element.createElement(MediaUpload, {
                onSelect: onSelectImage,
                allowedTypes: ['image'],
                value: attrs.imageID,
                render: ({ open }) => attrs.imageURL 
                  ? wp.element.createElement('figure', { onClick: open, style: { cursor: 'pointer' } },
                      wp.element.createElement('img', { src: attrs.imageURL, alt: attrs.title, loading: 'lazy' })
                    )
                  : wp.element.createElement(Button, { isPrimary: true, onClick: open }, 'Select Image')
              })
            )
          ),
          wp.element.createElement('div', { className: 'block-about__body' },
            wp.element.createElement(RichText, {
              tagName: 'h2',
              className: 'block-title text-center',
              value: attrs.title,
              onChange: (val)=> props.setAttributes({ title: val }),
              placeholder: 'Enter title...'
            }),
            wp.element.createElement(RichText, {
              tagName: 'div',
              className: 'block-desc',
              multiline: 'p',
              value: attrs.desc,
              onChange: (val)=> props.setAttributes({ desc: val }),
              placeholder: 'Enter description...'
            })
          )
        )
      ];
    },
    save: function(props){
      const a = props.attributes;
      return wp.element.createElement('section', { className: 'block-about' },
        wp.element.createElement('div', { className: 'block-about__head' },
          wp.element.createElement('div', { className: 'scroll-circle' },
            wp.element.createElement('svg', { viewBox: '0 0 200 200' },
              wp.element.createElement('path', { id: 'circlePath', d: 'M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0', fill: 'none' }),
              wp.element.createElement('text', {},
                wp.element.createElement('textPath', { href: '#circlePath', startOffset: '0' }, a.circle)
              )
            ),
            wp.element.createElement('div', { className: 'arrow' })
          ),
          wp.element.createElement('div', { className: 'block-about__img' },
            a.imageURL ? wp.element.createElement('figure', {},
              wp.element.createElement('img', { 
                src: a.imageURL, 
                alt: a.title || 'About Me',
                loading: 'lazy'
              })
            ) : null
          )
        ),
        wp.element.createElement('div', { className: 'block-about__body' },
          wp.element.createElement(RichText.Content, { 
            tagName: 'h2',
            className: 'block-title text-center',
            value: a.title
          }),
          wp.element.createElement(RichText.Content, { 
            tagName: 'div',
            className: 'block-desc',
            value: a.desc
          })
        )
      );
    }
  });
  }

  if (wp && wp.domReady) {
    wp.domReady(register);
  } else {
    register();
  }
})(window.wp);


