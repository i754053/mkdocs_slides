import os
import shutil

from mkdocs.config import config_options
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File

from .renderer import SlideRenderer
from .slide_parser import SlideParser


class SlidesPlugin(BasePlugin):
    config_scheme = (
        ('font_size', config_options.Type(str, default='32px')),
        ('template', config_options.Type(str, default='')),
    )

    def __init__(self):
        self.parser = SlideParser()
        self.renderer = SlideRenderer()
        self.slides_to_write = []

    def on_config(self, config):
        """Set up the plugin configuration"""
        if self.config.get('template'):
            template_path = os.path.join(
                os.path.dirname(config['docs_dir']),
                self.config['template']
            )
            self.parser.set_template(template_path)
        if self.config.get('font_size'):
            self.parser.set_config({'font_size': self.config['font_size']})
        return config

    def on_files(self, files, config):
        """Add slide HTML files to the build"""
        # Add our static files
        static_path = os.path.join(os.path.dirname(__file__), "static")

        css_file = files.get_file_from_path("assets/slides/css/slides.css")
        if not css_file:
            files.append_file(
                path="assets/slides/css/slides.css",
                src_dir=os.path.join(static_path, "css"),
                dest_dir=os.path.join(config["site_dir"], "assets/slides/css"),
                use_directory_urls=False,
            )

        js_file = files.get_file_from_path("assets/slides/js/slides.js")
        if not js_file:
            files.append_file(
                path="assets/slides/js/slides.js",
                src_dir=os.path.join(static_path, "js"),
                dest_dir=os.path.join(config["site_dir"], "assets/slides/js"),
                use_directory_urls=False,
            )

        # Add slide HTML files
        for slide in self.slides_to_write:
            # Create a proper MkDocs File object
            file_path = os.path.join(config["docs_dir"], slide["path"])
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(slide["content"])

            slide_file = File(
                path=slide["path"],
                src_dir=config["docs_dir"],
                dest_dir=config["site_dir"],
                use_directory_urls=False,
            )
            files.append(slide_file)

        return files

    def on_page_markdown(self, markdown, page, config, files):
        """Process the markdown content and replace slides blocks with HTML"""
        try:
            # Clear previous slides
            self.slides_to_write = []

            # Process markdown and collect slides
            processed_markdown = self.parser.process_markdown(
                markdown,
                page,
                config,
            )

            if "```slides" in markdown:
                import time
                v = int(time.time())
                page.head_extra = [
                    f'<link rel="stylesheet" href="/assets/slides/css/slides.css?v={v}">',
                    f'<script src="/assets/slides/js/slides.js?v={v}"></script>',
                ]
            return processed_markdown
        except Exception as e:
            print(f"Error processing slides in {page.file.src_path}: {str(e)}")
            return markdown
