(function(wp){
  const { registerBlockType } = wp.blocks;
  const { InspectorControls, RichText } = wp.blockEditor || wp.editor;
  const { PanelBody, CheckboxControl, Spinner } = wp.components;
  const { useState, useEffect } = wp.element;

  function register(){
  console.log('[MMS Service Block] Registering block...');
  registerBlockType('mms/service', {
    title: 'Service Block',
    icon: 'admin-tools',
    category: 'mms-blocks',
    attributes: {
      title: { type: 'string', default: 'Our Services' },
      desc: { type: 'string', default: '' },
      selectedServices: { type: 'array', default: [] }
    },
    edit: function(props){
      console.log('[MMS Service Block] Edit function called', props);
      const attrs = props.attributes;
      const [services, setServices] = useState([]);
      const [loading, setLoading] = useState(true);

      // Fetch services from WordPress REST API
      useEffect(function() {
        wp.apiFetch({ path: '/wp/v2/service?per_page=100' })
          .then(function(data) {
            setServices(data);
            setLoading(false);
          })
          .catch(function(error) {
            console.error('Error fetching services:', error);
            setLoading(false);
          });
      }, []);

      function toggleService(serviceId) {
        var selected = attrs.selectedServices || [];
        var index = selected.indexOf(serviceId);
        var newSelected;
        
        if (index > -1) {
          newSelected = selected.filter(function(id) { return id !== serviceId; });
        } else {
          newSelected = selected.concat([serviceId]);
        }
        
        props.setAttributes({ selectedServices: newSelected });
      }

      // Get selected services for preview
      var selectedServicesData = services.filter(function(service) {
        return (attrs.selectedServices || []).indexOf(service.id) > -1;
      });

      return [
        wp.element.createElement(InspectorControls, {},
          wp.element.createElement(PanelBody, { title: 'Service Settings' },
            loading 
              ? wp.element.createElement(Spinner, {})
              : wp.element.createElement('div', {},
                  wp.element.createElement('p', { style: { fontWeight: 'bold', marginBottom: '12px' } }, 
                    'Chọn dịch vụ hiển thị:'
                  ),
                  services.length === 0
                    ? wp.element.createElement('p', { style: { color: '#999' } }, 
                        'Không có dịch vụ nào. Vui lòng tạo Service posts.'
                      )
                    : services.map(function(service) {
                        return wp.element.createElement(CheckboxControl, {
                          key: service.id,
                          label: service.title.rendered,
                          checked: (attrs.selectedServices || []).indexOf(service.id) > -1,
                          onChange: function() { toggleService(service.id); }
                        });
                      })
                )
          )
        ),

        wp.element.createElement('section', { className: 'block-service' },
          wp.element.createElement('div', { className: 'container' },
            wp.element.createElement(RichText, {
              tagName: 'h2',
              className: 'block-title block-title-scroll',
              value: attrs.title,
              onChange: function(val) { props.setAttributes({ title: val }); },
              placeholder: 'Enter service block title...'
            }),
            wp.element.createElement(RichText, {
              tagName: 'div',
              className: 'block-desc',
              multiline: 'p',
              value: attrs.desc,
              onChange: function(val) { props.setAttributes({ desc: val }); },
              placeholder: 'Enter description...'
            }),

            wp.element.createElement('div', { className: 'block-service__list' },
              selectedServicesData.length === 0
                ? wp.element.createElement('p', { style: { textAlign: 'center', padding: '40px 20px', background: '#f0f0f0', borderRadius: '8px' } },
                    'Chọn dịch vụ từ sidebar bên phải →'
                  )
                : selectedServicesData.map(function(service) {
                    var title = service.title.rendered;
                    var excerpt = service.excerpt.rendered.replace(/<[^>]*>/g, ''); // Strip HTML
                    var firstLetter = title.charAt(0);
                    
                    return wp.element.createElement('div', { 
                      key: service.id,
                      className: 'block-service__item' 
                    },
                      wp.element.createElement('div', { className: 'item__link' },
                        wp.element.createElement('span', { className: 'item__icon' }, firstLetter),
                        wp.element.createElement('h3', { className: 'item__title' }, title),
                        wp.element.createElement('div', { 
                          className: 'item__desc',
                          dangerouslySetInnerHTML: { __html: excerpt }
                        })
                      )
                    );
                  })
            )
          )
        )
      ];
    },
    save: function(props){
      // Return null vì block này sẽ render động từ PHP
      // WordPress sẽ gọi render_callback để generate HTML
      return null;
    }
  });
  }

  if (wp && wp.domReady) {
    wp.domReady(register);
  } else {
    register();
  }
})(window.wp);


