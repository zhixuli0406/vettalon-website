// Fixed, inert caller-policy examples. No browser, network or script execution.
#[test]
fn policy_css_url_http_lower_denied() {
    let mut builder = Builder::new();
    builder.add_generic_attributes(&["style"]);
    builder.filter_style_properties(hashset!["background-image"]);
    builder.url_schemes(hashset!["https"]);
    builder.url_relative(UrlRelative::Deny);
    let fragment = r#"<div style='background-image: url("http://example.invalid/fixture.png")'>http-lower</div>"#;
    assert_eq!(String::from(builder.clean(fragment)), r#"<div style="">http-lower</div>"#);
}

#[test]
fn policy_css_url_relative_lower_denied() {
    let mut builder = Builder::new();
    builder.add_generic_attributes(&["style"]);
    builder.filter_style_properties(hashset!["background-image"]);
    builder.url_schemes(hashset!["https"]);
    builder.url_relative(UrlRelative::Deny);
    let fragment = r#"<div style='background-image: url("/fixture.png")'>relative-lower</div>"#;
    assert_eq!(String::from(builder.clean(fragment)), r#"<div style="">relative-lower</div>"#);
}

#[test]
fn policy_css_url_http_upper_denied() {
    let mut builder = Builder::new();
    builder.add_generic_attributes(&["style"]);
    builder.filter_style_properties(hashset!["background-image"]);
    builder.url_schemes(hashset!["https"]);
    builder.url_relative(UrlRelative::Deny);
    let fragment = r#"<div style='background-image: URL("http://example.invalid/fixture.png")'>http-upper</div>"#;
    assert_eq!(String::from(builder.clean(fragment)), r#"<div style="">http-upper</div>"#);
}

#[test]
fn policy_css_url_relative_mixed_denied() {
    let mut builder = Builder::new();
    builder.add_generic_attributes(&["style"]);
    builder.filter_style_properties(hashset!["background-image"]);
    builder.url_schemes(hashset!["https"]);
    builder.url_relative(UrlRelative::Deny);
    let fragment = r#"<div style='background-image: Url("/fixture.png")'>relative-mixed</div>"#;
    assert_eq!(String::from(builder.clean(fragment)), r#"<div style="">relative-mixed</div>"#);
}

#[test]
fn policy_css_url_https_control() {
    let mut builder = Builder::new();
    builder.add_generic_attributes(&["style"]);
    builder.filter_style_properties(hashset!["background-image"]);
    builder.url_schemes(hashset!["https"]);
    builder.url_relative(UrlRelative::Deny);
    for function in ["url", "URL", "Url"] {
        let fragment = format!(
            r#"<div style='background-image: {}("https://example.invalid/fixture.png")'>https</div>"#,
            function,
        );
        let result = String::from(builder.clean(&fragment));
        let accepted = ["url", "URL", "Url"].map(|spelling| format!(
            r#"<div style="background-image:{}(&quot;https://example.invalid/fixture.png&quot;)">https</div>"#,
            spelling,
        ));
        assert!(accepted.contains(&result), "{} produced {:?}", function, result);
    }
}
